// Faixa contínua de marcas: entram pela direita e saem pela esquerda.
// A lista é duplicada e a pista desliza -50% em loop, sem saltos visíveis.

const BRANDS: [slug: string, name: string][] = [
  ["alfa-romeo", "Alfa Romeo"],
  ["audi", "Audi"],
  ["bentley", "Bentley"],
  ["bmw", "BMW"],
  ["cadillac", "Cadillac"],
  ["chevrolet", "Chevrolet"],
  ["chrysler", "Chrysler"],
  ["citroen", "Citroën"],
  ["dacia", "Dacia"],
  ["dodge", "Dodge"],
  ["ferrari", "Ferrari"],
  ["fiat", "Fiat"],
  ["ford", "Ford"],
  ["honda", "Honda"],
  ["hyundai", "Hyundai"],
  ["jaguar", "Jaguar"],
  ["jeep", "Jeep"],
  ["kia", "Kia"],
  ["lancia", "Lancia"],
  ["land-rover", "Land Rover"],
  ["lexus", "Lexus"],
  ["mazda", "Mazda"],
  ["mercedes-benz", "Mercedes-Benz"],
  ["mg", "MG"],
  ["mini", "Mini"],
  ["mitsubishi", "Mitsubishi"],
  ["nissan", "Nissan"],
  ["opel", "Opel"],
  ["peugeot", "Peugeot"],
  ["porsche", "Porsche"],
  ["renault", "Renault"],
  ["saab", "Saab"],
  ["seat", "Seat"],
  ["skoda", "Škoda"],
  ["smart", "Smart"],
  ["subaru", "Subaru"],
  ["suzuki", "Suzuki"],
  ["toyota", "Toyota"],
  ["volvo", "Volvo"],
  ["volkswagen", "Volkswagen"],
];

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 gap-3 pr-3" aria-hidden={hidden || undefined}>
      {BRANDS.map(([slug, name]) => (
        <li key={slug} className="grid h-20 w-28 shrink-0 place-items-center sm:h-24 sm:w-32">
          <img
            src={`/images/brands/${slug}.png`}
            alt={hidden ? "" : name}
            title={name}
            width={112}
            height={96}
            decoding="async"
            className="h-[88%] w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
          />
        </li>
      ))}
    </ul>
  );
}

export function BrandMarquee() {
  return (
    <div className="brand-marquee relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="brand-marquee-track flex w-max">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
