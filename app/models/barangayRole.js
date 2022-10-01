import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayRole extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
			// models.Barangay()
			models.BarangayRole.belongsTo(models.Barangay, {
				foreignKey: "barangay_id",
				as: "barangay",
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
