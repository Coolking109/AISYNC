export type Language = 'en' | 'es' | 'fr' | 'de';

export interface Translations {
  // Account Settings
  accountSettings: string;
  profile: string;
  security: string;
  preferences: string;
  
  // Profile Tab
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  updateProfile: string;
  profileUpdated: string;
  
  // Security Tab
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  changePassword: string;
  passwordChanged: string;
  twoFactorAuth: string;
  enable2FA: string;
  disable2FA: string;
  setupAuthenticator: string;
  scanQRCode: string;
  enterCodeManually: string;
  enterVerificationCode: string;
  verify: string;
  cancel: string;
  twoFactorEnabled: string;
  twoFactorDisabled: string;
  deleteAccount: string;
  deleteAccountWarning: string;
  confirmDeletion: string;
  
  // Preferences Tab
  appearanceLanguage: string;
  theme: string;
  light: string;
  dark: string;
  auto: string;
  language: string;
  emailNotifications: string;
  pushNotifications: string;
  autoSave: string;
  sessionTimeout: string;
  minutes: string;
  updatePreferences: string;
  preferencesUpdated: string;
  
  // Chat Interface
  newChat: string;
  startNewConversation: string;
  noChatSessions: string;
  searchPlaceholder: string;
  
  // Common
  save: string;
  loading: string;
  error: string;
  success: string;
  close: string;
  yes: string;
  no: string;
  
  // Test phrases for AI responses
  testGreeting: string;
  testQuestion: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Account Settings
    accountSettings: 'Account Settings',
    profile: 'Profile',
    security: 'Security',
    preferences: 'Preferences',
    
    // Profile Tab
    username: 'Username',
    email: 'Email',
    firstName: 'First Name',
    lastName: 'Last Name',
    updateProfile: 'Update Profile',
    profileUpdated: 'Profile updated successfully!',
    
    // Security Tab
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    passwordChanged: 'Password changed successfully!',
    twoFactorAuth: 'Two-Factor Authentication',
    enable2FA: 'Enable 2FA',
    disable2FA: 'Disable 2FA',
    setupAuthenticator: 'Set up your authenticator app',
    scanQRCode: 'Scan this QR code with your authenticator app',
    enterCodeManually: 'Or enter this key manually:',
    enterVerificationCode: 'Enter the 6-digit code from your app',
    verify: 'Verify',
    cancel: 'Cancel',
    twoFactorEnabled: '2FA has been enabled successfully!',
    twoFactorDisabled: '2FA has been disabled successfully!',
    deleteAccount: 'Delete Account',
    deleteAccountWarning: 'This action cannot be undone. All your data will be permanently deleted.',
    confirmDeletion: 'Confirm Deletion',
    
    // Preferences Tab
    appearanceLanguage: 'Appearance & Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    auto: 'Auto',
    language: 'Language',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    autoSave: 'Auto Save',
    sessionTimeout: 'Session Timeout',
    minutes: 'minutes',
    updatePreferences: 'Update Preferences',
    preferencesUpdated: 'Preferences updated successfully!',
    
    // Chat Interface
    newChat: 'New Chat',
    startNewConversation: 'Start a new conversation',
    noChatSessions: 'No chat sessions yet',
    searchPlaceholder: 'Ask me anything...',
    
    // Common
    save: 'Save',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    
    testGreeting: 'Hello Nexus',
    testQuestion: 'What can you help me with?',
  },
  
  es: {
    // Account Settings
    accountSettings: 'Configuración de Cuenta',
    profile: 'Perfil',
    security: 'Seguridad',
    preferences: 'Preferencias',
    
    // Profile Tab
    username: 'Nombre de Usuario',
    email: 'Correo Electrónico',
    firstName: 'Nombre',
    lastName: 'Apellido',
    updateProfile: 'Actualizar Perfil',
    profileUpdated: '¡Perfil actualizado exitosamente!',
    
    // Security Tab
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    changePassword: 'Cambiar Contraseña',
    passwordChanged: '¡Contraseña cambiada exitosamente!',
    twoFactorAuth: 'Autenticación de Dos Factores',
    enable2FA: 'Habilitar 2FA',
    disable2FA: 'Deshabilitar 2FA',
    setupAuthenticator: 'Configura tu aplicación de autenticación',
    scanQRCode: 'Escanea este código QR con tu aplicación de autenticación',
    enterCodeManually: 'O ingresa esta clave manualmente:',
    enterVerificationCode: 'Ingresa el código de 6 dígitos de tu aplicación',
    verify: 'Verificar',
    cancel: 'Cancelar',
    twoFactorEnabled: '¡2FA ha sido habilitado exitosamente!',
    twoFactorDisabled: '¡2FA ha sido deshabilitado exitosamente!',
    deleteAccount: 'Eliminar Cuenta',
    deleteAccountWarning: 'Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.',
    confirmDeletion: 'Confirmar Eliminación',
    
    // Preferences Tab
    appearanceLanguage: 'Apariencia e Idioma',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    auto: 'Automático',
    language: 'Idioma',
    emailNotifications: 'Notificaciones por Email',
    pushNotifications: 'Notificaciones Push',
    autoSave: 'Guardado Automático',
    sessionTimeout: 'Tiempo de Sesión',
    minutes: 'minutos',
    updatePreferences: 'Actualizar Preferencias',
    preferencesUpdated: '¡Preferencias actualizadas exitosamente!',
    
    // Chat Interface
    newChat: 'Nuevo Chat',
    startNewConversation: 'Iniciar una nueva conversación',
    noChatSessions: 'Aún no hay sesiones de chat',
    searchPlaceholder: 'Pregúntame cualquier cosa...',
    
    // Common
    save: 'Guardar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    close: 'Cerrar',
    yes: 'Sí',
    no: 'No',
    
    testGreeting: 'Hola Nexus',
    testQuestion: '¿En qué puedes ayudarme?',
  },
  
  fr: {
    // Account Settings
    accountSettings: 'Paramètres de Compte',
    profile: 'Profil',
    security: 'Sécurité',
    preferences: 'Préférences',
    
    // Profile Tab
    username: "Nom d'utilisateur",
    email: 'Email',
    firstName: 'Prénom',
    lastName: 'Nom',
    updateProfile: 'Mettre à jour le profil',
    profileUpdated: 'Profil mis à jour avec succès!',
    
    // Security Tab
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    changePassword: 'Changer le mot de passe',
    passwordChanged: 'Mot de passe changé avec succès!',
    twoFactorAuth: 'Authentification à deux facteurs',
    enable2FA: 'Activer 2FA',
    disable2FA: 'Désactiver 2FA',
    setupAuthenticator: 'Configurez votre application d\'authentification',
    scanQRCode: 'Scannez ce code QR avec votre application d\'authentification',
    enterCodeManually: 'Ou entrez cette clé manuellement:',
    enterVerificationCode: 'Entrez le code à 6 chiffres de votre application',
    verify: 'Vérifier',
    cancel: 'Annuler',
    twoFactorEnabled: '2FA a été activé avec succès!',
    twoFactorDisabled: '2FA a été désactivé avec succès!',
    deleteAccount: 'Supprimer le compte',
    deleteAccountWarning: 'Cette action ne peut pas être annulée. Toutes vos données seront supprimées définitivement.',
    confirmDeletion: 'Confirmer la suppression',
    
    // Preferences Tab
    appearanceLanguage: 'Apparence et Langue',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    auto: 'Automatique',
    language: 'Langue',
    emailNotifications: 'Notifications par email',
    pushNotifications: 'Notifications push',
    autoSave: 'Sauvegarde automatique',
    sessionTimeout: 'Délai de session',
    minutes: 'minutes',
    updatePreferences: 'Mettre à jour les préférences',
    preferencesUpdated: 'Préférences mises à jour avec succès!',
    
    // Chat Interface
    newChat: 'Nouveau Chat',
    startNewConversation: 'Commencer une nouvelle conversation',
    noChatSessions: 'Aucune session de chat pour le moment',
    searchPlaceholder: 'Demandez-moi tout...',
    
    // Common
    save: 'Enregistrer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    close: 'Fermer',
    yes: 'Oui',
    no: 'Non',
    
    testGreeting: 'Bonjour Nexus',
    testQuestion: 'Comment pouvez-vous m\'aider?',
  },
  
  de: {
    // Account Settings
    accountSettings: 'Kontoeinstellungen',
    profile: 'Profil',
    security: 'Sicherheit',
    preferences: 'Einstellungen',
    
    // Profile Tab
    username: 'Benutzername',
    email: 'E-Mail',
    firstName: 'Vorname',
    lastName: 'Nachname',
    updateProfile: 'Profil aktualisieren',
    profileUpdated: 'Profil erfolgreich aktualisiert!',
    
    // Security Tab
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    changePassword: 'Passwort ändern',
    passwordChanged: 'Passwort erfolgreich geändert!',
    twoFactorAuth: 'Zwei-Faktor-Authentifizierung',
    enable2FA: '2FA aktivieren',
    disable2FA: '2FA deaktivieren',
    setupAuthenticator: 'Richten Sie Ihre Authentifizierungs-App ein',
    scanQRCode: 'Scannen Sie diesen QR-Code mit Ihrer Authentifizierungs-App',
    enterCodeManually: 'Oder geben Sie diesen Schlüssel manuell ein:',
    enterVerificationCode: 'Geben Sie den 6-stelligen Code aus Ihrer App ein',
    verify: 'Verifizieren',
    cancel: 'Abbrechen',
    twoFactorEnabled: '2FA wurde erfolgreich aktiviert!',
    twoFactorDisabled: '2FA wurde erfolgreich deaktiviert!',
    deleteAccount: 'Konto löschen',
    deleteAccountWarning: 'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden dauerhaft gelöscht.',
    confirmDeletion: 'Löschung bestätigen',
    
    // Preferences Tab
    appearanceLanguage: 'Aussehen & Sprache',
    theme: 'Theme',
    light: 'Hell',
    dark: 'Dunkel',
    auto: 'Automatisch',
    language: 'Sprache',
    emailNotifications: 'E-Mail-Benachrichtigungen',
    pushNotifications: 'Push-Benachrichtigungen',
    autoSave: 'Automatisches Speichern',
    sessionTimeout: 'Sitzungs-Timeout',
    minutes: 'Minuten',
    updatePreferences: 'Einstellungen aktualisieren',
    preferencesUpdated: 'Einstellungen erfolgreich aktualisiert!',
    
    // Chat Interface
    newChat: 'Neuer Chat',
    startNewConversation: 'Eine neue Unterhaltung beginnen',
    noChatSessions: 'Noch keine Chat-Sitzungen',
    searchPlaceholder: 'Frag mich alles...',
    
    // Common
    save: 'Speichern',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    close: 'Schließen',
    yes: 'Ja',
    no: 'Nein',
    
    testGreeting: 'Hallo Nexus',
    testQuestion: 'Wie können Sie mir helfen?',
  },
};

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key];
};
