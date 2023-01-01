import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class BarangayCaseType extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {}
	}

	BarangayCaseType.init(
		{
			barangay_case_type_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			case: DataTypes.STRING,
			details: DataTypes.STRING,
		},
		{
			sequelize,
			timestamps: false,
			// createdAt: "created_at",
			// updatedAt: "updated_at",
			modelName: "BarangayCaseType",
		}
	);

	return BarangayCaseType;
};
