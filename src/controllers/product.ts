import prisma from "@/db/client";

export async function getProducts() {
    const products = await prisma.product.findMany();
    return products;
}

export async function getProduct(id: string) {
    const product = await prisma.product.findUnique({
        where: {
            id: id
        }
    });

    return product;
}

export async function createProduct(product: any) {
    const newProduct = await prisma.product.create({
        data: product
    });

    return newProduct;
}

export async function updateProduct(id: string, product: any) {
    const updatedProduct = await prisma.product.update({
        where: {
            id: id
        },
        data: product
    });

    return updatedProduct;
}

export async function deleteProduct(id: string) {
    const deletedProduct = await prisma.product.delete({
        where: {
            id: id
        }
    });

    return deletedProduct;
}