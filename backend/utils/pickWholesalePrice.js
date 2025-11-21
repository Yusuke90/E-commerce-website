module.exports = function pickWholesalePrice(product, qty) {
  if (!product) return 0;
  if (product.wholesaleTiers && product.wholesaleTiers.length) {
    const tiers = product.wholesaleTiers.filter(t => qty >= t.minQty).sort((a,b)=>b.minQty-a.minQty);
    if (tiers.length) return tiers[0].pricePerUnit;
  }
  if (product.wholesalePrice && qty >= (product.wholesaleMinQty || 0)) return product.wholesalePrice;
  return product.retailPrice;
}
