// utilities/verifiedSources.js

// A broad but curated list of trusted resale marketplaces and official brand sites:
const VERIFIED_RESALE_SOURCES = [
    // — Multi‑Category / General
    'stockx.com',
    'goat.com',
    'grailed.com',
    '1stdibs.com',
    'therealreal.com',
    'vestiairecollective.com',
    'farfetch.com',
    'poshmark.com',
    'fashionphile.com',
    'tradesy.com',
    'theluxurycloset.com',
    'ebay.com',
    'mercari.com',
    'depop.com',
    'invaluable.com',
    'offerup.com',
    'craigslist.org',
    'thredup.com',
  
    // — Sneakers & Streetwear
    'flightclub.com',
    'stadiumgoods.com',
    'kickscrew.com',
    'kixify.com',
    'urbannecessities.com',
    'laced.com',
    'flight23.com',
    'solesupremacy.com',
    'solestage.com',
    'stockmarketla.com',
    'rif.la',
    'uniquehype.com',
    'lacelab.com',
    'sneakercon.com',
    'soulsupplier.com',
    'klekt.com',
  
    // — Handbags & Accessories
    'rebag.com',
    'fashionette.com',
    'luxedujour.com',
    'yoogiscloset.com',
    'theluxurycloset.com', // luxury‑focused consignment
    'bagborroworsteal.com',
    'designerconsigner.co.uk',
    'luxurygaragesale.com',
    'lxrandco.com',
  
    // — Fine Jewelry
    'truefacet.com',
    'fourtane.com',
    'sothebys.com',
    'christies.com',
    'worthy.com',
    'circa.com',
    'betteridge.com',
    'graff.com',
    'harrywinston.com',
    'debeers.com',
    'mikimoto.com',
    'pandora.net',
    'swarovski.com',
  
    // — Watches
    'chrono24.com',
    'watchbox.com',
    'watchfinder.co.uk',
    'bobswatches.com',
    'crownandcaliber.com',
    'analogshift.com',
    'govbergwatch.com',
    'javiermendoza.com',
    'chronext.com',
  
    // — Official Brand Websites
    // Handbags & Fashion Houses
    'hermes.com',
    'chanel.com',
    'louisvuitton.com',
    'dior.com',
    'prada.com',
    'gucci.com',
    'fendi.com',
    'saintlaurent.com',
    'burberry.com',
    'valentino.com',
    'alexandermcqueen.com',
    'balenciaga.com',
    'celine.com',
    'bottegaveneta.com',
    'givenchy.com',
    'versace.com',
    'marcjacobs.com',
    'coach.com',
    'michaelkors.com',
    'toryburch.com',
    'mulberry.com',
    'longchamp.com',
    'katespade.com',
    'furla.com',
    'loewe.com',
    'balmain.com',
    'moschino.com',
    'chloe.com',
    'tomford.com',
    'ralphlauren.com',
    'miumiu.com',
  
    // Jewelry Brands
    'cartier.com',
    'tiffany.com',
    'bvlgari.com',
    'vancleefarpels.com',
    'piaget.com',
    'chopard.com',
    'buccellati.com',
    'messika.com',
    'davidyurman.com',
  
    // Watch Brands
    'rolex.com',
    'patek.com',
    'audemarspiguet.com',
    'omega.com',
    'panerai.com',
    'jaeger-lecoultre.com',
    'breitling.com',
    'hublot.com',
    'tagheuer.com',
    'iwc.com',
    'zenith-watches.com',
    'grand-seiko.com',
    'seiko.com',
    'citizenwatch.com',
    'casio.com',
    'longines.com',
    'movado.com',
    'rado.com',
    'oris.ch',
    'montblanc.com',
    'richardmille.com',
  
    // Sneaker Brands
    'nike.com',
    'jordan.com',
    'adidas.com',
    'puma.com',
    'reebok.com',
    'newbalance.com',
    'converse.com',
    'vans.com',
    'asics.com',
    'underarmour.com',
    'fila.com',
    'saucony.com',
    'brooksrunning.com',
    'salomon.com',
    'hoka.com',
    'merrell.com',
    'timberland.com',
    'dcshoes.com',
    'skechers.com',
    'ugg.com',
    'crocs.com',

    // Luxury Shoes & Fashion
    'berluti.com',
    'jimmychoo.com',
    'manoloblahnik.com',
    'christianlouboutin.com',
    'ferragamo.com',
    'tods.com',
    'giuseppezanotti.com',
    'church-footwear.com',
    'johnlobb.com',
    'brunellocucinelli.com',
    'loropiana.com',
    'zegna.com',
    'brioni.com',
    'vacheron-constantin.com',
    'alange-soehne.com',
    'blancpain.com',

    // Additional Luxury Brands
    'alexanderwang.com',
    'aquazzura.com',
    'moncler.com',
    'thombrowne.com',
    'isseymiyake.com',
    'stuartweitzman.com',
    'lululemon.com',
    'rimowa.com',
    'goyard.com',
    'jennikayne.com',

    // — Jewelry Brands (additions)
    'chaumet.com',             // French haute-joaillerie
    'boucheron.com',           // Parisian jeweler
    'parmigianifleurier.com',  // Swiss watchmaker & jeweler
    'girard-perregaux.com',    // Swiss haute horlogerie
    'jaquet-droz.com',         // Swiss luxury watches
    'ulysse-nardin.com',       // Swiss marine-inspired watches
    'glashuette-original.com',  // German haute horlogerie

    // — Handbags & Fashion Houses (additions)
    'delvaux.com',             // Belgian leather goods
    'valextra.com',            // Italian leather brand
    'off---white.com',         // Off-White™ c/o Virgil Abloh
    'carolinaherrera.com',     // Venezuelan American couture
    'mansurgavriel.com',       // New-York luxury leather
    'proenzaschouler.com',     // American designer label
    'stellamccartney.com',     // British sustainable luxury
    '31philliplim.com',        // Modern womenswear
    'oscardelarenta.com',      // Hispanic-American couture
    'eliesaab.com',            // Lebanese bridal & couture
    'kenzo.com',               // Parisian fashion house
    'bally.com',               // Swiss leather & footwear

    // — Luxury Shoes & Fashion (additions)
    'roger-vivier.com',        // French luxury footwear
  ];
  
  module.exports = {
    VERIFIED_RESALE_SOURCES,
  };
  