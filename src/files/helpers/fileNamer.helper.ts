// import { Request } from "express";
import { v4 as uuid } from "uuid";

export const fileNamer = (req: Express.Request, file: Express.Multer.File, callback: Function) => { 
	// console.log(file);
	// false => no aceptamos el archivo
	if( !file ) return callback(new Error('file is empty'), false);

	const fileExtension = file.mimetype.split('/')[1];
	const fileName = `${uuid()}.${ fileExtension }`;

	callback(null, fileName);
}