
(function(){
  const houseForm = document.querySelector('#house-ai-form');
  if(houseForm){
    const output = document.querySelector('#house-ai-output');
    houseForm.addEventListener('submit', function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(houseForm).entries());
      const regionAdvice = {
        'Scotland & North': 'Prioritise thermal retention, sheltered openings, robust drainage and wind-conscious detailing. In cooler and wetter regions, fully bespoke glazing layouts matter more than simply choosing the cheapest roof type.',
        'Midlands': 'Aim for an all-season balance: strong thermal performance for winter, enough opening flexibility for summer, and detailing that keeps maintenance simple over time.',
        'London & South East': 'Lean into a cleaner glazed look with slim sightlines, strong solar control and a layout that feels like a real architectural extension rather than an add-on.',
        'South West & Coastal': 'Coastal and exposed locations benefit from corrosion-aware detailing, strong weather seals and roof choices that stay comfortable even when wind direction changes quickly.',
        'Wales': 'Rain resilience, protected transitions to the house and a practical glazing layout should come first. A well-designed mixed solid-and-glass scheme often performs better than an all-glass concept.',
        'East of England': 'Open views and clean contemporary lines work well here, but the structure still needs weather control, good drainage and the right balance between transparency and privacy.'
      };
      const priorityRoof = {
        'Year-round warmth': 'a thermally strong fixed glass or insulated roof strategy depending on how much natural light you want',
        'Panoramic views': 'a premium fixed glass roof paired with large glazed openings',
        'Privacy': 'a mixed roof composition with selected solid zones and carefully positioned side treatments',
        'Flexible opening': 'a pergola-led or louvred concept that can adapt through the day',
        'Low maintenance': 'a robust, simple roof specification with easy-clean drainage and durable powder-coated framing'
      };
      const budgetMap = {
        'Practical': 'For a practical budget, we would keep the geometry clean, focus spend on the main elevation and use the most visible opening where it adds real value.',
        'Mid-range': 'For a mid-range budget, we can create a more architectural feel with better opening flexibility, cleaner sightlines and stronger detailing at the roof perimeter.',
        'Premium': 'For a premium brief, we would push toward a fully bespoke statement system with cleaner transitions, larger glazed spans and a sharper indoor-outdoor feel.'
      };
      const lifestyleMap = {
        'Family lounge': 'A family lounge concept works best when comfort, sliding circulation and furniture zoning are designed together from day one.',
        'Dining & hosting': 'For dining and entertaining, door opening width matters as much as the roof because it changes how easily the house and garden connect during events.',
        'Poolside relaxation': 'A poolside scheme benefits from strong sightlines, controlled glare and materials that still look premium when used frequently.',
        'Garden room office': 'An office or studio needs stable comfort, acoustic calm, privacy control and enough daylight without overheating the workspace.',
        'Wellness / spa': 'A wellness-led winter garden should feel calm, softly lit and private, with a roof strategy that keeps the atmosphere controlled throughout the year.'
      };

      let roof = 'Bioclimatic Pergola';
      let sides = 'Sliding door frontage with fixed glass returns';
      if(data.priority === 'Year-round warmth') roof = 'Fixed Glass or carefully planned insulated combination';
      if(data.priority === 'Panoramic views') roof = 'Fixed Glass';
      if(data.priority === 'Flexible opening') roof = data.budget === 'Premium' ? 'Lux Bioclimatic Pergola' : 'Bioclimatic Pergola';
      if(data.priority === 'Low maintenance') roof = 'Solid Polycarbonate or a simplified pergola-led roof depending on the brief';
      if(data.priority === 'Privacy') sides = 'Fixed glass plus selected sandwich panel/privacy zones';
      if(data.lifestyle === 'Dining & hosting') sides = data.budget === 'Premium' ? 'Bifold opening with fixed side glass' : 'Sliding door front with fixed glass sides';
      if(data.lifestyle === 'Garden room office') sides = 'More fixed glazing, stronger privacy control and at least one controlled opening bay';
      if(data.region === 'South West & Coastal' || data.region === 'Wales') sides += ', with stronger weather sealing and more protected openings';

      output.innerHTML = `
        <h4>Your AI design direction</h4>
        <p>${regionAdvice[data.region]}</p>
        <div class="reco-block"><strong>Recommended roof direction:</strong><p>For this combination, we would start with <b>${roof}</b>. The main reason is that your top priority points toward ${priorityRoof[data.priority]}, while the chosen region still requires a layout that feels comfortable in real British weather.</p></div>
        <div class="reco-block"><strong>Recommended side configuration:</strong><p>We would begin with <b>${sides}</b>. This keeps the space bright and usable while preserving the custom flexibility Hawk is known for. Unlike standard-size systems, we can tailor the opening pattern around your furniture layout, garden view and property proportions.</p></div>
        <div class="reco-block"><strong>Budget shaping:</strong><p>${budgetMap[data.budget]} ${lifestyleMap[data.lifestyle]}</p></div>
        <div class="reco-block"><strong>What we would add next:</strong><p>We would normally refine drainage, lighting, frame colour, threshold detail, heating position and whether the scheme should lean closer to a true extension feel or a lighter all-season outdoor room. The best final answer depends on your exact elevation, neighbouring privacy and the size of the opening back to the house.</p></div>
      `;
      output.classList.add('active');
    });
  }

  const businessForm = document.querySelector('#business-ai-form');
  if(businessForm){
    const output = document.querySelector('#business-ai-output');
    businessForm.addEventListener('submit', function(e){
      e.preventDefault();
      const data = Object.fromEntries(new FormData(businessForm).entries());
      const typeMap = {
        'Turkish Restaurant': {
          roof: 'Bioclimatic Pergola',
          text: 'For a Turkish restaurant, guests usually expect atmosphere, warmth and generous opening flexibility. A bioclimatic layout gives the terrace a real hospitality feel without looking temporary.'
        },
        'Takeaway': {
          roof: 'Solid Polycarbonate or Sandwich Panel',
          text: 'A takeaway enclosure is usually less about ambience and more about queue control, service clarity and weather protection. Practical solid zones often outperform a fully glazed concept here.'
        },
        'Fish & Chips': {
          roof: 'Sandwich Panel or Solid Polycarbonate',
          text: 'For fish and chips, durability, easy cleaning, controlled ventilation and a simple, robust frontage are normally more important than a delicate all-glass aesthetic.'
        },
        'Restaurant': {
          roof: 'Bioclimatic Pergola',
          text: 'A broader restaurant format benefits from flexibility. You want daylight, controlled airflow and a terrace that can convert from lunch to evening trade without feeling exposed.'
        },
        'Cafe': {
          roof: 'Pergola or Bioclimatic Pergola',
          text: 'Cafes usually benefit from a softer, more open frontage. Morning light, a welcoming edge and an easy inside-outside transition help convert casual footfall into seated trade.'
        },
        'Shisha Bar': {
          roof: 'Pergola / Bioclimatic / Lux Bioclimatic',
          text: 'For a shisha bar, an operable roof is usually the strongest direction. The terrace must feel protected without becoming stagnant, and opening control becomes a key part of the brief.'
        },
        'Rooftop Bar': {
          roof: 'Lux Bioclimatic Pergola',
          text: 'Rooftop concepts need premium presence, wind management and a system that feels high-end both in daylight and after dark.'
        },
        'Hotel Terrace': {
          roof: 'Lux Bioclimatic Pergola',
          text: 'A hotel terrace needs a polished arrival feel, strong lighting integration and an enclosure language that supports a premium guest experience.'
        },
        'Bakery': {
          roof: 'Fixed Glass or light Pergola concept',
          text: 'Bakery seating often sells best with brightness, visibility and a clean frontage that helps the business look active from the street.'
        },
        'Events Venue': {
          roof: 'Lux Bioclimatic Pergola or large-span Bioclimatic Pergola',
          text: 'Events-led spaces need adaptability. The system should respond to changing guest numbers, seasonality and evening ambience without looking makeshift.'
        }
      };
      const regionMap = {
        'Scotland & North': 'In colder or wetter areas, we would tighten weather protection, prioritise robust drainage and keep openings more controlled so the terrace still earns money in difficult weeks.',
        'Midlands': 'Across the Midlands, the sweet spot is usually a balanced all-season setup that protects covers without making the space feel visually heavy.',
        'London & South East': 'In London and the South East, appearance matters strongly. Cleaner lines, a sharper façade and premium detailing can directly support brand perception.',
        'South West & Coastal': 'In coastal or exposed locations, stronger sealing, careful material selection and practical wind strategy become far more important.',
        'Wales': 'For Wales, rain management and transitional weather use should sit near the top of the brief so the investment keeps producing value.',
        'East of England': 'In more open eastern locations, the right combination of transparent sides and protected edges can keep the terrace bright without feeling vulnerable.'
      };
      const budgetText = {
        'Budget': 'For a lower spend, keep the structural language simple, use one strong headline roof choice and avoid unnecessary complexity on secondary elevations.',
        'Mid': 'With a mid-range budget, you can combine better opening types with a stronger branded feel and improved comfort during shoulder seasons.',
        'Premium': 'With a premium budget, we would push the terrace into a true signature space with more refined finishes, lighting integration and a more dramatic hospitality impact.'
      };
      let sideRecommendation = 'Sliding door frontage with fixed glass side sections';
      let specialTier = '';
      if(data.business === 'Shisha Bar'){
        sideRecommendation = 'Guillotine glazing or sliding screens with strong controlled ventilation zones';
        specialTier = '<p><b>Roof tier guide:</b> budget = Pergola, mid = Bioclimatic Pergola, premium = Lux Bioclimatic Pergola. That route gives the operator better control over airflow, comfort and atmosphere.</p>';
      }
      if(data.business === 'Takeaway') sideRecommendation = 'Sandwich panel service wall with a practical glazed customer-facing elevation';
      if(data.business === 'Fish & Chips') sideRecommendation = 'A durable mixed frontage using solid panels where privacy, service routing or easy cleaning matter most';
      if(data.business === 'Cafe') sideRecommendation = 'A lighter openable frontage to increase visual invitation from the pavement';
      if(data.business === 'Hotel Terrace' || data.business === 'Rooftop Bar') sideRecommendation = 'Premium glazing with stronger wind management and a more luxurious sense of enclosure';

      const roofName = typeMap[data.business].roof;
      output.innerHTML = `
        <h4>Your AI business recommendation</h4>
        <p>${typeMap[data.business].text}</p>
        <div class="reco-block"><strong>Roof strategy</strong><p>We would start with <b>${roofName}</b>. This suits the business model because it supports revenue in mixed weather while still helping the space feel intentional rather than temporary. ${specialTier}</p></div>
        <div class="reco-block"><strong>Side strategy</strong><p>Our starting point would be <b>${sideRecommendation}</b>. Side choices matter commercially because they affect guest comfort, queue management, smoke/air movement, visual merchandising and how clearly the terrace reads from the street.</p></div>
        <div class="reco-block"><strong>Regional fit</strong><p>${regionMap[data.region]}</p></div>
        <div class="reco-block"><strong>Budget direction</strong><p>${budgetText[data.budget]}</p></div>
        <div class="reco-block"><strong>Final design layer</strong><p>We would then refine lighting, signage visibility, heaters, branded colour matching, circulation, table spacing and whether the terrace needs more privacy or more openness to maximise covers and guest dwell time.</p></div>
      `;
      output.classList.add('active');
    });
  }
})();
