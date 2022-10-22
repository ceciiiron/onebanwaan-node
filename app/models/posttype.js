import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class PostType extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {}
	}

	PostType.init(
		{
			post_type_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING },
		},
		{
			sequelize,
			timestamps: false,
			modelName: "PostType",
		}
	);

	return PostType;
};
