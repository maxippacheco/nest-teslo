import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';
import { DataSource, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage, Product } from './entities';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    private readonly dataSource: DataSource,

  ){}

  async create(createProductDto: CreateProductDto) {
    try {

      const { images = [], ...productDetails } = createProductDto;

      // createProductDto luce como la entity
      const product = this.productRepository.create({
        ...productDetails,
        //creo las imagenes dentro de otra instancia de creacion
        images: images.map( image => this.productImageRepository.create({ url: image }))
      });

      await this.productRepository.save( product );
    
      return {...product, images};

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  async findAll({limit = 10, offset = 0}: PaginationDto) {
    const products = await this.productRepository.find({
      take: limit,
      skip: offset,
      relations: {
        images: true
      }
    });

    return products.map( product => ({
      ...product,
      images: product.images.map( img => img.url )
    }))
  }

  async findOne(term: string) {
    // const product = await this.productRepository.findOneBy({  });
    let product: Product;

    if(isUUID(term)){
      product = await this.productRepository.findOneBy({ id: term });
    }else{
      const queryBuilder = this.productRepository.createQueryBuilder('prod');
      
      //* queryBuilder es para hacer queries, muy util
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(), 
          slug: term.toLowerCase()
        })
        .leftJoinAndSelect('prod.images', 'prodImages')
        .getOne();
    }
    
    if( !product ) throw new NotFoundException(`Product with this term doesnt exist`)

    return product;
  }

  async findOnePlain(term: string){
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map(img => img.url)
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const { images, ...toUpdate } = updateProductDto;

    const product = await this.productRepository.preload({ id, ...toUpdate, });

    if(!product) throw new NotFoundException(`Product not found`);

    // Create query runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      if( images ){
        await queryRunner.manager.delete( ProductImage, { product: { id }})
        
        product.images = images.map( 
          image => this.productImageRepository.create({ url: image }) 
        )
      }
      // else {
        // product.images = await this.productImageRepository.findBy({ product: { id }})
      // }
      
      // await this.productRepository.save( product );      
      await queryRunner.manager.save( product );

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.findOnePlain( id );
      // return product
  
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBExceptions(error);    
    }


  }

  async remove(id: string) {
   
    const product = await this.findOne( id );
    await this.productRepository.remove( product );

    return `Removed`;
  }

  private handleDBExceptions( error: any ){
    if( error.code === '23505' ){
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Unexpectede error, check server logs');
  }

  async deleteAllProducts(){
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

}
