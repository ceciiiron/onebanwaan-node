import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class Barangay extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			/* --------------------- Barangay 1:M Barangay hotlines --------------------- */
			models.Barangay.hasMany(models.BarangayHotline, {
				foreignKey: "barangay_id",
				as: "hotlines",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayHotline.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});

			/* ----------------------- Barangay 1:M Barangay roles ---------------------- */
			models.Barangay.hasMany(models.BarangayRole, {
				foreignKey: "barangay_id",
				as: "barangay_roles",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayRole.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});

			/* --------------------- Barangay 1:M Barangay Officials --------------------- */
			models.Barangay.hasMany(models.BarangayOfficial, {
				foreignKey: "barangay_id",
				as: "officials",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayOfficial.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
			});
		}
	}

	Barangay.init(
		{
			barangay_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING, allowNull: false },
			logo: { type: DataTypes.STRING(500) },
			cover_image_link: { type: DataTypes.STRING(500) },
			number: { type: DataTypes.INTEGER, allowNull: false },
			bio: { type: DataTypes.STRING },
			address: { type: DataTypes.STRING, allowNull: false },
			directory: { type: DataTypes.STRING, allowNull: false },
			lat: { type: DataTypes.DOUBLE },
			lng: { type: DataTypes.DOUBLE },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "Barangay",
		}
	);

	return Barangay;
};
