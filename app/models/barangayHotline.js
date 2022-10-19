import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayHotline extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}

	BarangayHotline.init(
		{
			barangay_hotline_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING, allowNull: false },
			number: { type: DataTypes.STRING, allowNull: false },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "BarangayHotline",
		}
	);

	return BarangayHotline;
};
