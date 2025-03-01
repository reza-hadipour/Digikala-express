const { Basket, BasketProduct } = require('./basket.model');
const { Product } = require('../product/product.model');

// Function to add a product to the basket
const addToBasket = async (req, res) => {
    const { userId, productId, quantity } = req.body;

    try {
        // Check if the basket exists for the user
        let basket = await Basket.findOne({ where: { user_id: userId } });

        // If no basket exists, create a new one
        if (!basket) {
            basket = await Basket.create({ user_id: userId });
        }

        // Check if the product already exists in the basket
        let basketProduct = await BasketProduct.findOne({
            where: {
                basket_id: basket.id,
                product_id: productId
            }
        });

        if (basketProduct) {
            // If the product exists, update the quantity
            basketProduct.quantity += quantity;
            await basketProduct.save();
        } else {
            // If the product does not exist, create a new entry
            const product = await Product.findByPk(productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            await BasketProduct.create({
                basket_id: basket.id,
                product_id: productId,
                quantity: quantity,
                price: product.price,
                discount: product.discount,
                total_price: (product.price - product.discount) * quantity
            });
        }

        return res.status(200).json({ message: 'Product added to basket successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred while adding to the basket' });
    }
};

module.exports = { addToBasket };
