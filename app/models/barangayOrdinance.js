import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayOrdinance extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.Barangay.hasMany(models.BarangayOrdinance, {
				foreignKey: "barangay_id",
				as: "ordinances",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.BarangayOrdinance.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay_ordinance",
			});
		}
	}

	BarangayOrdinance.init(
		{
			barangay_ordinance_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			title: { type: DataTypes.STRING(255), allowNull: false },
			description: { type: DataTypes.STRING(500), allowNull: true },
			ordinance_link: { type: DataTypes.STRING(500), allowNull: true },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayOrdinance",
		}
	);

	return BarangayOrdinance;
};
