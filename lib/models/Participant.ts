import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: "" },
    location: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

participantSchema.index({ phoneNumber: 1 }, { unique: true });

export const Participant =
  mongoose.models.Participant || mongoose.model("Participant", participantSchema);
