import { readdirSync } from "fs";
import path, { basename as _basename, join } from "path";
import { fileURLToPath } from "url";
import Sequelize, { DataTypes } from "sequelize";
import { DATABASE, USER, PASSWORD, HOST, dialect as _dialect, pool as _pool } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url); //index.js
const __dirname = path.dirname(__filename); //current directory
const basename = _basename(__filename);

const sequelize = new Sequelize(DATABASE, USER, PASSWORD, {
	host: HOST,
	dialect: _dialect,
	pool: { ..._pool },
});

const modelFiles = readdirSync(__dirname).filter((file) => {
	return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";
});

let asyncImportsArray = await Promise.all(modelFiles.map((file) => import("./" + file)));
asyncImportsArray.forEach((module) => {
	module.default(sequelize, DataTypes);
});

// .forEach(async (file) => {
// 	const model = (await import("./" + "barangay.js")).default(sequelize, DataTypes);
// 	// const model = require(join(__dirname, file))(sequelize, DataTypes)
// 	db[model.name] = model;
// });

// Object.keys(db).forEach((modelName) => {
// 	if (db[modelName].associate) {
// 		db[modelName].associate(db);
// 	}
// });

const db = {};

Object.keys(sequelize.models).forEach((modelName) => {
	if (sequelize.models[modelName].associate) {
		sequelize.models[modelName].associate(sequelize.models);
	}
});

// (await import("./" + "admin.js")).default(sequelize, DataTypes);
// (await import("./" + "barangay.js")).default(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
