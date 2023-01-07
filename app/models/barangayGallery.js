import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayGallery extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.Barangay.hasMany(models.BarangayGallery, {
				foreignKey: "barangay_id",
				as: "gallery",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayGallery.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay_gallery",
			});
		}
	}

	BarangayGallery.init(
		{
			barangay_gallery_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING(255), allowNull: false },
			description: { type: DataTypes.STRING(500), allowNull: true },
			directory: { type: DataTypes.STRING(255), allowNull: false },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayGallery",
		}
	);

	return BarangayGallery;
};
