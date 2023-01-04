import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
	class AuditLog extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			models.ResidentAccount.hasMany(models.AuditLog, {
				foreignKey: "resident_account_id",
				as: "resident_account_audit",
				onDelete: "CASCADE",
				onUpdate: "CASCADE",
			});

			models.AuditLog.belongsTo(models.ResidentAccount, {
				foreignKey: "resident_account_id",
				as: "audit_log",
			});
		}
	}

	AuditLog.init(
		{
			audit_log_id: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			module: { type: DataTypes.STRING, allowNull: false },
			action: { type: DataTypes.STRING, allowNull: false },
			description: { type: DataTypes.STRING, allowNull: false },
		},
		{
			sequelize,
			timestamps: true,
			createdAt: "created_at",
			updatedAt: false,
			modelName: "AuditLog",
		}
	);

	return AuditLog;
};
