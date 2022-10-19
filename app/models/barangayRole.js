import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayRole extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Barangay Role 1:M Resident Account
			models.BarangayRole.hasMany(models.ResidentAccount, {
				foreignKey: "barangay_role_id",
				as: "resident_accounts",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.ResidentAccount.belongsTo(models.BarangayRole, {
				foreignKey: "barangay_role_id",
				as: "role",
			});
		}
	}

	BarangayRole.init(
		{
			barangay_role_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayRole",
		}
	);

	return BarangayRole;
};
