
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "farmer", "trader"],
        default: "farmer"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Region",
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
