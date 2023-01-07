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
			models.Admin.belongsTo(models.ResidentAccount, { foreignKey: "resident_account_id", onDelete: "SET NULL", onUpdate: "SET NULL" });
			models.ResidentAccount.hasOne(models.Admin, {
				foreignKey: "resident_account_id",
				as: "resident_account",
			});
		}
	}

	Admin.init(
		{
			admin_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			first_name: { type: DataTypes.STRING, allowNull: false },
			middle_initial: { type: DataTypes.STRING, allowNull: true },
			last_name: { type: DataTypes.STRING, allowNull: false },
			suffix: { type: DataTypes.STRING, allowNull: true },
			// name: { type: DataTypes.STRING, allowNull: false },
			email: { type: DataTypes.STRING, allowNull: false },
			role: { type: DataTypes.STRING, allowNull: false },
			password: { type: DataTypes.STRING, allowNull: false },
			contact_number: DataTypes.STRING,
			profile_image_link: { type: DataTypes.STRING, allowNull: true },
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
