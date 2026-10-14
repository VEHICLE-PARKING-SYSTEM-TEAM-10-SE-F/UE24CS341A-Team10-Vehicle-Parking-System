const mongoose = require('mongoose');

// SRS Appendix B.4. Roles per SRS 2.3: Parking Attendant and Administrator.
const ROLES = ['ATTENDANT', 'ADMIN'];

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, maxlength: 30 },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ROLES },
  active: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
