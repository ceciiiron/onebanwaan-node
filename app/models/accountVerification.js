import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class AccountVerification extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Resident Details 1:1 Resident Account
			models.AccountVerification.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
				as: "account_details",
			});
			models.ResidentAccount.hasOne(models.AccountVerification, {
				foreignKey: "resident_account_id",
				as: "account_verification",
			});
		}
	}

	AccountVerification.init(
		{
			verification_images: { type: DataTypes.STRING, allowNull: false },
			remarks: { type: DataTypes.STRING, allowNull: true },
		},
		{
			sequelize,
			timestamps: false,
			// createdAt: "created_at",
			// updatedAt: ,
			modelName: "AccountVerification",
		}
	);

	AccountVerification.removeAttribute("id");

	return AccountVerification;
};
