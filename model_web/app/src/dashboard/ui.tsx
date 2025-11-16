import type { FC, ReactNode } from "react";
import { Box } from "@mui/material";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import type { TabChange, TabProps } from "../tabs/types";
export const FlexContainer: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row", // Options: 'row' (default), 'column', 'row-reverse', 'column-reverse'
        justifyContent: "space-between", // Options: 'flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'
        alignItems: "center", // Options: 'flex-start', 'center', 'flex-end', 'stretch', 'baseline'
        gap: 1, // Spacing between children (uses theme.spacing)
        p: 1, // Padding inside the container
        bgcolor: "background.paper", // Background color
        borderRadius: 1, // Rounded corners
        boxShadow: 1, // Subtle shadow
      }}
    >
      {children}
    </Box>
  );
};

export function TabPanel(props: {
  [x: string]: any;
  children: any;
  value: any;
  index: any;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
}

export const FinancialTabs: FC<{
  value: number;
  options: TabProps[];
  onChange: TabChange;
  children: ReactNode;
}> = ({ value, options, onChange, children }) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={onChange}
          variant="scrollable" // 支持后续添加更多tab时滚动
          scrollButtons="auto" // 自动显示滚动按钮
          aria-label="Finn Asset Tabs"
        >
          {options.map((option) => (
            <Tab
              key={option.symbol}
              label={option.symbol}
              value={option.value}
            />
          ))}
        </Tabs>
      </Box>
      {children}
    </Box>
  );
};
