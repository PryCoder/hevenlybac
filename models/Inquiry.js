const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true, maxlength: 100 },
    email:     { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone:     { type: String, trim: true, maxlength: 30, default: '' },
    date:      { type: String, default: '' },
    eventType: { type: String, required: true, enum: ['wedding','engagement','reception','sangeet','mehendi','haldi','multiple','other'] },
    location:  { type: String, trim: true, maxlength: 200, default: '' },
    guests:    { type: String, default: '' },
    budget:    { type: String, required: true },
    message:   { type: String, required: true, trim: true, maxlength: 2000 },
    ip:        { type: String },
    status:    { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
