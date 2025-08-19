import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    motDePasse: { type: String, required: true },
    role: { type: String, enum: ["admin", "client"], default: "client" },
    photo: {
      type: String,
      default: "https://res.cloudinary.com/demo/image/upload/v1690000000/default-avatar.png"
    }
  },
  { timestamps: true }
)

userSchema.pre('save', async function(next) {
  if (!this.isModified('motDePasse')) return next();
  const salt = await bcrypt.genSalt(10);
  this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
  next();
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.motDePasse);
};

export default mongoose.model('User', userSchema);
