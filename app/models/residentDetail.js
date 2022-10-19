import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class ResidentDetail extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			// Resident Details 1:1 Resident Account
			models.ResidentDetail.belongsTo(models.ResidentAccount, { foreignKey: "resident_account_id", onDelete: "CASCADE", onUpdate: "CASCADE" });
			models.ResidentAccount.hasOne(models.ResidentDetail, {
				foreignKey: "resident_account_id",
				as: "resident_details",
			});
		}
	}

	ResidentDetail.init(
		{
			sex: { type: DataTypes.STRING, allowNull: true },
			birthdate: { type: DataTypes.STRING, allowNull: true },
			age: { type: DataTypes.STRING, allowNull: true },
			home_address: { type: DataTypes.STRING, allowNull: true },
			contact_number: { type: DataTypes.STRING, allowNull: true },
			occupation: { type: DataTypes.STRING, allowNull: true },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: "updated_at",
			modelName: "ResidentDetail",
		}
	);

	ResidentDetail.removeAttribute("id");

	return ResidentDetail;
};
