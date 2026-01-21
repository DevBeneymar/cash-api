const prisma = require("../config/dbConnect");
// const bcrypt = require("../utils/bcrypt");
const bcrypt = require("bcryptjs");

// const jwt = require("../utils/jwt");
const jwt = require("jsonwebtoken");

// REGISTER - inscription d’un nouvel admin / utilisateur principal
exports.register = async (req, res) => {
  try {
    const { name, email, password, storeName } = req.body;

    // vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: false, message: "Email déjà utilisé" });
    }

    // créer le store automatiquement
    const store = await prisma.store.create({
      data: { name: storeName, plan: "free", isActive: true }
    });

    // hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password);

    // créer l'utilisateur principal (admin)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
        storeId: store.id
      }
    });

    // générer token
    const token = jwt.generate({ id: user.id, role: user.role, storeId: store.id });

    res.json({ status: true, user, token });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// LOGIN - connexion
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await prisma.user.findUnique({ where: { email } });
//     if (!user) {
//       return res.status(404).json({ status: false, message: "Utilisateur introuvable" });
//     }

//     const valid = await bcrypt.compare(password, user.password);
//     if (!valid) {
//       return res.status(401).json({ status: false, message: "Mot de passe incorrect" });
//     }

//     const token = jwt.generate({ id: user.id, role: user.role, storeId: user.storeId });

//     res.json({ status: true, user, token });
//   } catch (error) {
//     res.status(500).json({ status: false, message: error.message });
//   }
// };
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = email, phone ou username

    // chercher l'utilisateur par email, phone ou username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { username: identifier }
        ],
        isDeleted: false
      }
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "Utilisateur introuvable" });
    }

    // vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ status: false, message: "Mot de passe incorrect" });
    }

    //- récupérer le store principal si besoin (si multi-store, voir user_stores)
    const storeId = user.stores.length > 0 ? user.stores[0].id : null;

    // générer token
    const token = jwt.generate({ id: user.id, role: user.role, storeId });

    res.json({ status: true, user, token });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// exports.test = async(req,res)=>{
// console.log('test');
// };

