import numpy as np
import pandas as pd
import joblib, json, os, warnings
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
warnings.filterwarnings('ignore')

SAVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'saved')
os.makedirs(SAVE_DIR, exist_ok=True)

def generate_dataset(n=50000, fraud_ratio=0.02, seed=42):
    rng = np.random.RandomState(seed)
    nf = int(n * fraud_ratio); nn = n - nf
    normal = pd.DataFrame({
        'amount': rng.lognormal(3.5,1.2,nn), 'hour': rng.randint(7,23,nn),
        'day_of_week': rng.randint(0,7,nn),
        'merchant_cat': rng.choice([0,1,2,3,4],nn,p=[.35,.25,.20,.12,.08]),
        'distance_km': np.abs(rng.normal(10,8,nn)),
        'trans_per_day': rng.poisson(3,nn).clip(1,15),
        'balance_ratio': rng.beta(5,2,nn),
        'is_international': rng.binomial(1,0.05,nn),
        'velocity_1h': rng.poisson(1,nn).clip(0,5), 'label': 0
    })
    fraud = pd.DataFrame({
        'amount': rng.lognormal(5.5,1.8,nf), 'hour': rng.choice(range(0,6),nf),
        'day_of_week': rng.randint(0,7,nf),
        'merchant_cat': rng.choice([0,1,2,3,4],nf,p=[.10,.10,.10,.30,.40]),
        'distance_km': np.abs(rng.normal(80,50,nf)),
        'trans_per_day': rng.poisson(12,nf).clip(5,30),
        'balance_ratio': rng.beta(1,5,nf),
        'is_international': rng.binomial(1,0.70,nf),
        'velocity_1h': rng.poisson(6,nf).clip(3,20), 'label': 1
    })
    return pd.concat([normal,fraud]).sample(frac=1,random_state=seed).reset_index(drop=True)

FEATURE_COLS = ['amount','hour','day_of_week','merchant_cat','distance_km',
                'trans_per_day','balance_ratio','is_international','velocity_1h']
ENG_COLS = FEATURE_COLS + ['log_amount','is_night','is_weekend','amount_x_vel']

def engineer(df):
    df = df.copy()
    df['log_amount']   = np.log1p(df['amount'])
    df['is_night']     = (df['hour'].between(0,5)).astype(int)
    df['is_weekend']   = (df['day_of_week']>=5).astype(int)
    df['amount_x_vel'] = df['log_amount'] * df['velocity_1h']
    return df

def train():
    print("Generating dataset...")
    df = engineer(generate_dataset())
    df.drop(columns=['label']).head(200).to_csv(os.path.join(SAVE_DIR,'sample_transactions.csv'),index=False)
    X = df[ENG_COLS].values; y = df['label'].values
    X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2,random_state=42,stratify=y)
    print("Scaling features...")
    scaler = StandardScaler()
    Xts = scaler.fit_transform(X_train); Xvs = scaler.transform(X_test)
    print("Training Isolation Forest (200 trees)...")
    iso = IsolationForest(n_estimators=200,contamination=0.02,random_state=42,n_jobs=-1)
    iso.fit(Xts[y_train==0])
    raw = iso.decision_function(Xvs)
    preds = (iso.predict(Xvs)==-1).astype(int)
    smin,smax = raw.min(),raw.max()
    scores = 1-(raw-smin)/(smax-smin+1e-9)
    print(classification_report(y_test,preds,target_names=['Normal','Anomaly']))
    print(f"ROC-AUC: {roc_auc_score(y_test,scores):.4f}")
    joblib.dump(iso,   os.path.join(SAVE_DIR,'isolation_forest.pkl'))
    joblib.dump(scaler,os.path.join(SAVE_DIR,'scaler.pkl'))
    meta = {'feature_cols':ENG_COLS,'base_feature_cols':FEATURE_COLS,
            'score_min':float(smin),'score_max':float(smax),
            'model_type':'IsolationForest','n_estimators':200,'contamination':0.02}
    with open(os.path.join(SAVE_DIR,'model_meta.json'),'w') as f: json.dump(meta,f,indent=2)
    base = scores.mean()
    imp = {}
    for i,col in enumerate(ENG_COLS):
        Xp = Xvs.copy(); np.random.shuffle(Xp[:,i])
        ps = 1-(iso.decision_function(Xp)-smin)/(smax-smin+1e-9)
        imp[col] = float(abs(ps.mean()-base))
    with open(os.path.join(SAVE_DIR,'feature_importance.json'),'w') as f: json.dump(imp,f,indent=2)
    print(f"Model saved to: {SAVE_DIR}")

if __name__=='__main__': train()
