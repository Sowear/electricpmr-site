import Layout from "@/components/layout/Layout";
import EstimatesList from "@/components/estimator/EstimatesList";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";

const Estimator = () => {
  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-6 lg:py-8">
          <EstimatesList />
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default Estimator;
