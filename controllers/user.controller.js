const prisma = require("../config/dbConnect");
const bcrypt = require("bcryptjs");

// CREATE USER interne (par admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: false, message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        storeId: req.user.storeId // appartient au même store que l'admin
      }
    });

    res.json({ status: true, user });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// GET ALL USERS d'un store
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { storeId: req.user.storeId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json({ status: true, users });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findFirst({
      where: { id: parseInt(id), storeId: req.user.storeId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ status: false, message: "Utilisateur introuvable" });

    res.json({ status: true, user });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.updateMany({
      where: { id: parseInt(id), storeId: req.user.storeId },
      data: { name, email, role }
    });

    if (user.count === 0) return res.status(404).json({ status: false, message: "Utilisateur introuvable" });

    res.json({ status: true, message: "Utilisateur mis à jour" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.deleteMany({
      where: { id: parseInt(id), storeId: req.user.storeId }
    });

    if (user.count === 0) return res.status(404).json({ status: false, message: "Utilisateur introuvable" });

    res.json({ status: true, message: "Utilisateur supprimé" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};
