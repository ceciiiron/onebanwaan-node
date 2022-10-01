import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class Admin extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// define association here
		}
	}

	Admin.init(
		{
			admin_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			name: { type: DataTypes.STRING, allowNull: false },
			email: { type: DataTypes.STRING, allowNull: false },
			password: { type: DataTypes.STRING, allowNull: false },
			contact_number: DataTypes.STRING,
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "Admin",
		}
	);

	return Admin;
};
