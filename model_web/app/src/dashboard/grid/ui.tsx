import { DataGrid } from "@mui/x-data-grid";
import { Card, CardContent, Typography } from "@mui/material";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import type { AllocationGridProps } from "./types";

const AllocationDataGrid: FC<AllocationGridProps> = ({ rows, columns }) => {
  const { t } = useTranslation();
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t("portfolio.assetAllocationTable")}
        </Typography>
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            localeText={{
              noRowsLabel: t("portfolio.noRows"),
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10]}
            disableRowSelectionOnClick
            getRowId={(r) => r.asset}
            sx={{
              "& .MuiDataGrid-row.Mui-odd": {
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AllocationDataGrid;
