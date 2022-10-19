import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayRolePermission extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.BarangayRole.belongsToMany(models.BarangayPermission, {
				// uniqueKey: "barangay_role_permission_id",
				foreignKey: "barangay_role_id",
				as: "barangay_role_permissions",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				through: models.BarangayRolePermission,
			});

			models.BarangayPermission.belongsToMany(models.BarangayRole, {
				// uniqueKey: "barangay_role_permission_id",
				foreignKey: "barangay_permission_id",
				as: "barangay_role_permissions",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				through: models.BarangayRolePermission,
			});
		}
	}

	BarangayRolePermission.init(
		{
			// barangay_role_permission_id: {
			// 	type: DataTypes.INTEGER,
			// 	autoIncrement: true,
			// 	primaryKey: true,
			// 	allowNull: false,
			// },
		},
		{
			sequelize,
			timestamps: false,
			modelName: "BarangayRolePermission",
		}
	);

	return BarangayRolePermission;
};
