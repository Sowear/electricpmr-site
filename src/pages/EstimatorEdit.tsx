import Layout from "@/components/layout/Layout";
import EstimateEditor from "@/components/estimator/EstimateEditor";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";

const EstimatorEdit = () => {
  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-4 lg:py-6">
          <EstimateEditor />
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default EstimatorEdit;
