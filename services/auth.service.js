const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(userData) {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new AppError('Cet email est déjà utilisé', 400);
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, config.security.bcryptRounds || 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || 'user',
          phone: userData.phone || null,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Générer les tokens
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user,
        tokens
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Erreur lors de l'inscription: ${error.message}`, 500);
    }
  }

  /**
   * Connexion utilisateur
   */
  async login(email, password) {
    try {
      // Trouver l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        throw new AppError('Votre compte est désactivé. Contactez l\'administrateur.', 403);
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      // Supprimer le mot de passe de l'objet user
      const { password: _, ...userWithoutPassword } = user;

      // Générer les tokens
      const tokens = this.generateTokens(user.id, user.role);

      // Enregistrer le refresh token en base (optionnel)
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Erreur lors de la connexion: ${error.message}`, 500);
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(refreshToken) {
    try {
      // Vérifier le refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Vérifier si le token est encore valide en base (optionnel)
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: decoded.userId,
          token: refreshToken,
          expiresAt: { gt: new Date() }
        }
      });

      if (!storedToken) {
        throw new AppError('Refresh token invalide ou expiré', 401);
      }

      // Récupérer l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        throw new AppError('Utilisateur non trouvé ou désactivé', 401);
      }

      // Générer un nouveau access token
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.accessTokenExpiry }
      );

      return { accessToken };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Token invalide', 401);
      }
      if (error instanceof AppError) throw error;
      throw new AppError(`Erreur lors du rafraîchissement du token: ${error.message}`, 500);
    }
  }

  /**
   * Déconnexion
   */
  async logout(userId, refreshToken) {
    try {
      // Supprimer le refresh token de la base
      await prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken
        }
      });

      return { message: 'Déconnexion réussie' };
    } catch (error) {
      throw new AppError(`Erreur lors de la déconnexion: ${error.message}`, 500);
    }
  }

  /**
   * Mot de passe oublié
   */
  async forgotPassword(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });

      if (!user) {
        // Pour des raisons de sécurité, ne pas révéler si l'email existe
        return { message: 'Si cet email existe, un lien de réinitialisation vous sera envoyé' };
      }

      // Générer un token de réinitialisation
      const resetToken = jwt.sign(
        { userId: user.id },
        config.jwt.secret + user.password, // Ajouter le hash du mot de passe pour l'unicité
        { expiresIn: '1h' }
      );

      // Enregistrer le token en base
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000) // 1 heure
        }
      });

      // ICI: Envoyer l'email avec le lien de réinitialisation
      // const resetUrl = `${config.appUrl}/reset-password?token=${resetToken}`;
      // await sendResetEmail(user.email, resetUrl);

      return { message: 'Lien de réinitialisation envoyé par email' };
    } catch (error) {
      throw new AppError(`Erreur lors de la demande de réinitialisation: ${error.message}`, 500);
    }
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(token, newPassword) {
    try {
      // Vérifier le token
      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          used: false
        },
        include: { user: true }
      });

      if (!resetToken) {
        throw new AppError('Token invalide ou expiré', 400);
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds || 10);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      });

      // Marquer le token comme utilisé
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      });

      // Supprimer tous les refresh tokens existants (pour sécurité)
      await prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId }
      });

      return { message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Erreur lors de la réinitialisation: ${error.message}`, 500);
    }
  }

  /**
   * Générer les tokens JWT
   */
  generateTokens(userId, role) {
    const accessToken = jwt.sign(
      { userId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      { userId, role },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 * 1000 // 15 minutes en millisecondes
    };
  }

  /**
   * Sauvegarder le refresh token en base
   */
  async saveRefreshToken(userId, token) {
    try {
      // Décode le token pour obtenir la date d'expiration
      const decoded = jwt.decode(token);
      
      await prisma.refreshToken.create({
        data: {
          userId,
          token,
          expiresAt: new Date(decoded.exp * 1000) // Convertir timestamp en Date
        }
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du refresh token:', error);
      // Ne pas lever d'erreur ici pour ne pas bloquer la connexion
    }
  }

  /**
   * Vérifier si l'utilisateur existe
   */
  async userExists(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });
    return !!user;
  }
}

module.exports = new AuthService();