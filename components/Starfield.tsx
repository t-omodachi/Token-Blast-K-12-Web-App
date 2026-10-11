/*
 * Static star background + purple glow,
 * same look as the model select screen.
 */
export default function Starfield() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, white 98%, transparent),
            radial-gradient(1px 1px at 100px 80px, white 98%, transparent),
            radial-gradient(2px 2px at 170px 130px, white 98%, transparent),
            radial-gradient(1px 1px at 250px 200px, white 98%, transparent),
            radial-gradient(2px 2px at 340px 120px, white 98%, transparent)
          `,
          backgroundSize: "400px 250px",
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl" />
    </>
  );
}
