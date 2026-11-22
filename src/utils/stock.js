const Agreement = require('../models/Agreement');
const Crop = require('../models/Crop');
const Offer = require('../models/Offer');


const EPS = 1e-9;


const reserveStock = (cropId, qty) =>
    Crop.findOneAndUpdate(
        {
            _id: cropId,
            status: 'active',
            availableQuantity: { $gte: qty - EPS }
        },
        { $inc: { availableQuantity: -qty, reservedQuantity: qty } },
        { new: true }
    );

const releaseStock = (cropId, qty) =>
    Crop.findOneAndUpdate(
        {
            _id: cropId,
            reservedQuantity: { $gte: qty - EPS }
        },
        { $inc: { availableQuantity: qty, reservedQuantity: -qty } },
        { new: true }
    );

const sellReservedStock = (cropId, qty) =>
    Crop.findOneAndUpdate(
        {
            _id: cropId,
            reservedQuantity: { $gte: qty - EPS }
        },
        { $inc: { reservedQuantity: -qty, soldQuantity: qty } },
        { new: true }
    );

const reconcileStock = async (log = console) => {

        try {
            await Offer.collection.dropIndex('supplyRequest_1_seller_1');
        } catch (error) {
            if (error.code !== 27 && error.codeName !== 'IndexNotFound') {
                throw error;
            }
        }

        await Offer.createIndexes();
        await Agreement.createIndexes();

        const cancelledOfferIds = await Agreement.distinct('offer', {
            status: 'cancelled',
            offer: { $type: 'objectId' }
        });
        const stillUsedOfferIds = await Agreement.distinct('offer', {
            status: { $ne: 'cancelled' },
            offer: { $type: 'objectId' }
        });
        const stillUsedSet = new Set(stillUsedOfferIds.map((id) => id.toString()));
        const reusableOfferIds = cancelledOfferIds.filter(
            (id) => !stillUsedSet.has(id.toString())
        );

        if (reusableOfferIds.length) {
            await Offer.updateMany(
                { _id: { $in: reusableOfferIds }, status: 'accepted' },
                { $set: { status: 'pending' } }
            );
        }

        await Agreement.updateMany(
            { status: { $in: ['cancelled', 'completed'] }, stockReserved: true },
            { $set: { stockReserved: false } }
        );

        const stuck = await Agreement.find({
            $or: [
                { status: 'confirmed', stockReserved: false },
                {
                    status: 'pendingConfirmation',
                    buyerConfirmed: true,
                    sellerConfirmed: true,
                    stockReserved: false
                }
            ]
        });

        const cropIds = (await Agreement.distinct('crop')).map((id) => id.toString());

        for (const cropId of cropIds) {
            const crop = await Crop.findById(cropId);

            if (!crop) {
                throw new Error(`[stock] crop ${cropId} referenced by an agreement was not found`);
            }

            const agreements = await Agreement.find({
                crop: cropId,
                $or: [{ stockReserved: true }, { status: 'completed' }]
            });

            const reserved = agreements
                .filter((a) => a.stockReserved)
                .reduce((sum, a) => sum + a.quantity, 0);

            const sold = agreements
                .filter((a) => a.status === 'completed')
                .reduce((sum, a) => sum + a.quantity, 0);

            const available = crop.totalQuantity - reserved - sold;

            if (available < -EPS) {
                throw new Error(`[stock] crop ${cropId}: reserved+sold exceed total quantity`);
            } else if (
                Math.abs(crop.availableQuantity - available) > EPS ||
                Math.abs(crop.reservedQuantity - reserved) > EPS ||
                Math.abs(crop.soldQuantity - sold) > EPS
            ) {
                const repairResult = await Crop.updateOne(
                    { _id: crop._id },
                    {
                        $set: {
                            availableQuantity: Math.max(0, available),
                            reservedQuantity: reserved,
                            soldQuantity: sold
                        }
                    }
                );

                if (!repairResult.matchedCount) {
                    throw new Error(`[stock] crop ${cropId} disappeared during stock repair`);
                }

                log.warn(`[stock] crop ${cropId} counters repaired ` +
                    `(available ${crop.availableQuantity} -> ${available}, ` +
                    `reserved ${crop.reservedQuantity} -> ${reserved}, ` +
                    `sold ${crop.soldQuantity} -> ${sold})`);
            }

            for (const agreement of stuck.filter((a) => a.crop.toString() === cropId)) {
                const reservedCrop = await reserveStock(cropId, agreement.quantity);

                if (reservedCrop) {
                    const result = await Agreement.updateOne(
                        { _id: agreement._id, stockReserved: false },
                        { $set: { status: 'confirmed', stockReserved: true } }
                    );

                    if (!result.modifiedCount) {
                        const released = await releaseStock(cropId, agreement.quantity);
                        if (!released) {
                            throw new Error(`[stock] could not compensate reservation for agreement ${agreement._id}`);
                        }
                    }
                } else {
                    // not enough stock any more: back to pending, both sides must confirm again
                    const resetResult = await Agreement.updateOne(
                        { _id: agreement._id, stockReserved: false },
                        {
                            $set: {
                                status: 'pendingConfirmation',
                                buyerConfirmed: false,
                                sellerConfirmed: false
                            }
                        }
                    );

                    if (!resetResult.matchedCount) {
                        throw new Error(`[stock] could not reset interrupted agreement ${agreement._id}`);
                    }
                }
            }
        }
};

module.exports = {
    EPS,
    reserveStock,
    releaseStock,
    sellReservedStock,
    reconcileStock
};
