import { Box } from "@mui/material";
import logo from "/logo.png"; // 👈 IMPORT IT

export default function Logo({ size = 40 }) {
  return (
    <Box
      component="img"
      src={logo} // 👈 USE IMPORTED PATH
      alt="NoteCal logo"
      sx={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}
