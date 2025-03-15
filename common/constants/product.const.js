const PRODUCT_VARIANT = {
    Color: "color",
    Size: "size",
    ColorSize: "color-size",
    Other: "other"
}

Object.freeze(PRODUCT_VARIANT);

const PRODUCT_TYPE = {
    product: 'Product',
    variant: 'ProductVariant'
}

Object.freeze(PRODUCT_TYPE);

module.exports = {
    PRODUCT_VARIANT,
    PRODUCT_TYPE
}