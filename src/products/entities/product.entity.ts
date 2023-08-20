import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { ProductImage } from ".";
import { User } from "src/auth/entities/user.entity";

@Entity({ name: 'products' })
export class Product{
	
	@ApiProperty({
		example: 'dsrf43333-vcdf3-32dfas-33',
		description: 'Product ID',
		uniqueItems: true
	})
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ApiProperty({
		example: 'T-shirt Teslo',
		description: 'Product Title',
		uniqueItems: true
	})
	@Column('text', { unique: true	})
	title: string;
	
	@ApiProperty({
		example: 0,
		description: 'Product Price',
	})
	@Column('float', {
		default: 0
	})
	price: number;

	// acepta nulos, aunque no tiene sentido guardar nulos para seguir las reglas de normalizacion seria conveniente crear otra tabla donde solo tengamos los valores y evitar insertar nulos
	@ApiProperty({
		example: 'Este es un ejemplo',
		description: 'Product description',
		default: null
	})
	@Column('text', { nullable: true })
	description: string;

	@ApiProperty({
		example: 'T-shirt Teslo',
		description: 'Product Slug - for SEO',
		uniqueItems: true
	})
	@Column('text', { unique: true })
	slug: string;

	@ApiProperty({
		example: 10,
		description: 'Product stock',
		default: 0
	})
	@Column('int', {
		default: 0
	})
	stock: number;

	// con array en true defino que es arreglo
	@ApiProperty({
		example: ['M', 'XL', 'XXL'],
		description: 'Product sizes',
	})
	@Column('text', { array: true })
	sizes: string[];

	@ApiProperty()
	@Column('text')
	gender: string;

	// tags 
	@ApiProperty()
	@Column('text', { array: true, default: [] })
	tags: string[];

	// images
	@ApiProperty()
	@OneToMany(
		() => ProductImage,
		productImage => productImage.product,
		{ cascade: true, eager: true }
	)
	images?: ProductImage[];

	// user
	@ManyToOne(
		() => User,
		(user) => user.product,
		{ eager: true }
	)
	user: User;

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