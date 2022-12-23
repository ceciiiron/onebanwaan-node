import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class DocumentTypes extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {}
	}

	DocumentTypes.init(
		{
			document_type_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false,
			},
			code: DataTypes.STRING,
			name: DataTypes.STRING,
		},
		{
			sequelize,
			timestamps: false,
			// createdAt: "created_at",
			// updatedAt: "updated_at",
			modelName: "DocumentTypes",
		}
	);

	return DocumentTypes;
};
