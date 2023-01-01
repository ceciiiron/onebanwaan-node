import express, { json, urlencoded } from "express";
import cors from "cors";
const app = express();
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import methodOverride from "method-override";

import cookieParser from "cookie-parser";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
global.__base_dir = path.dirname(__filename);

/* ========================================================================== */
/*                                  DATABASE                                  */
/* ========================================================================== */
import db from "./app/models/index.js";
db.sequelize
	.sync()
	.then(() => {
		console.log("All Models Syncronized 👊✌️❤️💚🦅");
		console.log("Models: 👉🏼", db.sequelize.models);
	})
	.catch((err) => console.log("Failed to sync database: \n" + err.message));

/* ========================================================================== */
/*                          ROUTES AND CORS SETTINGS                          */
/* ========================================================================== */
const corsOptions = {
	methods: ["GET", "POST", "PUT", "DELETE"],
	origin: process.env.CORS_ORIGIN.split(","),
	credentials: true,
};
console.log("CORS OPTIONS 🧙🧙");
console.log(corsOptions);

app.use(cors(corsOptions));
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(cookieParser());
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Headers", "x-access-token, Origin, Content-Type, Accept");
	next();
});
app.use(methodOverride("X-HTTP-Method-Override"));

const sessionSettings = {
	key: "SESSIONID",
	secret: "secret-key",
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 86400 * 1000, //12 hours
	},
};

if (process.env.DEPLOYMENT === "production") {
	app.set("trust proxy", 1); // trust first proxy
	sessionSettings.cookie.secure = true; // serve secure cookies
	sessionSettings.cookie.sameSite = "none";
}

app.use(session(sessionSettings));

/* ========================================================================== */
/*                               REGISTER ROUTES                              */
/* ========================================================================== */

//Home route
app.get("/api", (req, res) => {
	res.json({ message: "Welcome to One Banwaan REST API." });
});

// require("./app/routes/authRoutes.js")(app);
// require("./app/routes/adminRoutes.js")(app);
// require("./app/routes/barangayRoutes.js")(app);

(await import("./app/routes/authRoutes.js")).default(app);
(await import("./app/routes/adminRoutes.js")).default(app);
(await import("./app/routes/postRoutes.js")).default(app);
(await import("./app/routes/barangayRoleRoutes.js")).default(app);
(await import("./app/routes/barangayOfficialRoutes.js")).default(app);
(await import("./app/routes/barangayHotlineRoutes.js")).default(app);
(await import("./app/routes/barangayFeedbackRoutes.js")).default(app);
(await import("./app/routes/barangayDocumentRoutes.js")).default(app);
(await import("./app/routes/barangayBlotterRoutes.js")).default(app);
(await import("./app/routes/barangayRoutes.js")).default(app);

(await import("./app/routes/residentRoutes.js")).default(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
