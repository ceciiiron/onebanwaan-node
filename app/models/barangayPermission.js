import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayPermission extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {}
	}

	BarangayPermission.init(
		{
			barangay_permission_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			name: DataTypes.STRING,
		},
		{
			sequelize,
			timestamps: false,
			// createdAt: "created_at",
			// updatedAt: "updated_at",
			modelName: "BarangayPermission",
		}
	);

	return BarangayPermission;
};
