
const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    parentRegion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Region", regionSchema);
