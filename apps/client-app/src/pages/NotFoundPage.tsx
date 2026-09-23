import { useTranslation } from "react-i18next";
import { NotFoundPage as SharedNotFoundPage } from "@ui/components/routes/NotFoundPage";

const NotFoundPage = () => {
  const { t } = useTranslation("navigation");

  return (
    <SharedNotFoundPage
      homePath="/"
      homeLabel={t(($) => $.navigation.back_to.home)}
    />
  );
};

export default NotFoundPage;
