import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { validate as isUUID } from 'uuid';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ){}

  async create(createProductDto: CreateProductDto) {
    try {


      // createProductDto luce como la entity
      const product = this.productRepository.create(createProductDto);

      await this.productRepository.save( product );
    
      return product;

    } catch (error) {
      this.handleDBExceptions(error);
    }

  }

  findAll({limit = 10, offset = 0}: PaginationDto) {
    return this.productRepository.find({
      take: limit,
      skip: offset,
      // todo relaciones
    });
  }

  async findOne(term: string) {
    // const product = await this.productRepository.findOneBy({  });
    let product: Product;

    if(isUUID(term)){
      product = await this.productRepository.findOneBy({ id: term });
    }else{
      const queryBuilder = this.productRepository.createQueryBuilder();
      
      //* queryBuilder es para hacer queries, muy util
      product = await queryBuilder
        .where(`UPPER(title) =:title or slug =:slug`, {
          title: term.toUpperCase(), 
          slug: term.toLowerCase()
        }).getOne();
    }
    
    if( !product ) throw new NotFoundException(`Product with this term doesnt exist`)

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
      ...updateProductDto
    });

    if(!product) throw new NotFoundException(`Product not found`);

    try {
      await this.productRepository.save( product );      
      return product;
  
    } catch (error) {
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
}
