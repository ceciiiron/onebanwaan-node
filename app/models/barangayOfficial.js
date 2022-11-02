import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayOfficial extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.BarangayOfficial.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "barangay_official",
				onDelete: "SET NULL",
				onUpdate: "SET NULL",
			});
			models.ResidentAccount.hasOne(models.BarangayOfficial, {
				foreignKey: "resident_account_id",
				as: "resident_account_official",
			});
		}
	}

	BarangayOfficial.init(
		{
			barangay_official_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			display_name: { type: DataTypes.STRING, allowNull: false },
			position: { type: DataTypes.STRING, allowNull: false },
			hierarchy: { type: DataTypes.INTEGER, allowNull: false },
			availability: { type: DataTypes.BOOLEAN, defaultValue: true },
			contact_number: { type: DataTypes.STRING, allowNull: true },
			email: { type: DataTypes.STRING, allowNull: true },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayOfficial",
		}
	);

	return BarangayOfficial;
};
