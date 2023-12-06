const router = require("express").Router();
// import auth controller
const AuthController = require("../controllers/AuthController");

// Import auth middleware
// const Auth = require('../middleware/Auth')

//import validation
// const check = require('../validation/CheckValidation')
// const auth = require('../middleware/authVerification')
// route list------------------------------------------------------------------------------------
router.post("/signUp", AuthController.authSignUp);
router.post("/login", AuthController.authLogin);
router.post("/verifyemail", AuthController.authVerifyemail);
router.post("/verifyForgetOTP", AuthController.authVerifyForgetOTP);
router.post("/Adminlogin", AuthController.authAdminLogin);

router.post("/forgotPassword", AuthController.forgotPassword);
router.post("/resetPassword", AuthController.resetPassword);

//router.post('/signUp',check.registerValidator(),AuthController.authSignUp)
//router.post('/login',check.loginValidator(),AuthController.authLogin)
//router.post('/forgotPassword',check.forgotPasswordValidator(),AuthController.forgotPassword)

module.exports = router;
