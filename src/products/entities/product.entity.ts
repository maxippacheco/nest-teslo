import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product{
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column('text', { unique: true	})
	title: string;

	@Column('float', {
		default: 0
	})
	price: number;

	// acepta nulos, aunque no tiene sentido guardar nulos para seguir las reglas de normalizacion seria conveniente crear otra tabla donde solo tengamos los valores y evitar insertar nulos
	@Column('text', { nullable: true })
	description: string;

	@Column('text', { unique: true })
	slug: string;

	@Column('int', {
		default: 0
	})
	stock: number;

	// con array en true defino que es arreglo
	@Column('text', { array: true })
	sizes: string[];

	@Column('text')
	gender: string;

	// tags 
	@Column('text', { array: true, default: [] })
	tags: string[];

	// images

	@BeforeInsert()
	checkSlugInsert(){
		if(!this.slug ){
			this.slug = this.title;
		}

		this.slug = this.slug.toLowerCase()
			.replaceAll(' ', '_')
			.replaceAll("'", '');
	}

	// para que no se formatee mal
	@BeforeUpdate()
	checkSlugUpdate(){
		this.slug = this.slug.toLowerCase()
			.replaceAll(' ', '_')
			.replaceAll("'", '');
	}
}