export const isResident = (req, res, next) => {
	console.log("CURRENT RESIDENT:", req.session.user);

	if (req.session?.user?.resident_account_id || req.session?.user?.admin_id) {
		return next();
	}

	// return res.status(401).send({ message: req.session });
	return res.status(401).send({ message: "Unauthorized" });
};
