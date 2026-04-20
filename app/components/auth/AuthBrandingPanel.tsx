interface AuthBrandingPanelProps {
  valueProps?: string[];
  testimonial?: {
    text: string;
    author: string;
  };
}

export default function AuthBrandingPanel({
  valueProps = [
    "280 compounds across 18 international food databases",
    "Personalized targets from 10 health authorities",
    "4-layer confidence scoring on every value",
    "Pattern discovery — not predefined assumptions",
  ],
  testimonial = {
    text: "Finally, a nutrition tracker backed by real science. The confidence scores help me trust the data.",
    author: "Sarah K., Nutritionist"
  }
}: AuthBrandingPanelProps) {
  return (
    <div className="branding-panel">
      <div className="logo-large">Nutri</div>

      <div className="value-props">
        <h2>Track what you eat. Understand how you feel.</h2>
        <ul>
          {valueProps.map((prop, i) => (
            <li key={i}>{prop}</li>
          ))}
        </ul>

        <div className="testimonial">
          &ldquo;{testimonial.text}&rdquo;
          <br />
          &mdash; {testimonial.author}
        </div>
      </div>
    </div>
  );
}
