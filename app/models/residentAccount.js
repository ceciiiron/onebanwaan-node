import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class ResidentAccount extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {}
	}

	ResidentAccount.init(
		{
			resident_account_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			professional_title: { type: DataTypes.STRING, allowNull: true }, //Dr. Mr.
			first_name: { type: DataTypes.STRING, allowNull: false },
			middle_initial: { type: DataTypes.STRING, allowNull: true },
			last_name: { type: DataTypes.STRING, allowNull: false },
			suffix: { type: DataTypes.STRING, allowNull: true },
			email: { type: DataTypes.STRING, allowNull: true },
			password: { type: DataTypes.STRING, allowNull: true },
			privacy: { type: DataTypes.BOOLEAN, defaultValue: false }, // 1 = public
			status: { type: DataTypes.BOOLEAN, defaultValue: true }, //1 = activated
			profile_image_link: { type: DataTypes.STRING, allowNull: true },
			cover_image_link: { type: DataTypes.STRING, allowNull: true },
			bio: { type: DataTypes.STRING, allowNull: true },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "ResidentAccount",
		}
	);

	return ResidentAccount;
};
